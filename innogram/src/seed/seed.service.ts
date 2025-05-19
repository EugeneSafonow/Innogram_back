import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Photo } from '../entities/photo.entity';
import { Collection } from '../entities/collection.entity';
import { KeyWord } from '../entities/keyWord.entity';
import { Like } from '../entities/like.entity';
import { Comment } from '../entities/comment.entity';
import { Favorite } from '../entities/favorite.entity';
import { S3Service } from '../s3/s3.service';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,
    @Inject('PHOTO_REPOSITORY')
    private photoRepository: Repository<Photo>,
    @Inject('COLLECTION_REPOSITORY')
    private collectionRepository: Repository<Collection>,
    @Inject('KEYWORD_REPOSITORY')
    private keyWordRepository: Repository<KeyWord>,
    @Inject('LIKE_REPOSITORY')
    private likeRepository: Repository<Like>,
    @Inject('COMMENT_REPOSITORY')
    private commentRepository: Repository<Comment>,
    @Inject('FAVORITE_REPOSITORY')
    private favoriteRepository: Repository<Favorite>,
    private s3Service: S3Service,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    if (process.env.SEED_DB === 'true') {
    console.log('Starting database seeding...');
    
    // Очистим базу данных перед сидированием
    await this.clearDatabase();
    
    // Создаем ключевые слова
    const keywords = await this.createKeywords();
    
    // Создаем пользователей
    const users = await this.createUsers(keywords);
    
    // Создаем фотографии
    const photos = await this.createPhotos(users, keywords);
    
    // Создаем коллекции
    await this.createCollections(users, photos);
    
    // Создаем лайки, избранное и комментарии
    await this.createInteractions(users, photos);
    
    console.log('Database seeding completed successfully!');
    }
  }

  private async clearDatabase() {
    console.log('Clearing database...');
    
    // Безопасная очистка таблиц с проверкой их существования
    await this.safelyTruncateTable('favorite');
    await this.safelyTruncateTable('like');
    await this.safelyTruncateTable('comment');
    
    // Очищаем связь между пользователями и ключевыми словами
    try {
      await this.userRepository.query('DELETE FROM users_interests_keywords');
      console.log('User-keywords relations cleared');
    } catch (error) {
      console.error('Error clearing user-keywords relations:', error.message);
    }
    
    // Очищаем связь между фотографиями и ключевыми словами
    try {
      await this.userRepository.query('DELETE FROM photo_key_words_key_word');
      console.log('Photo-keywords relations cleared');
    } catch (error) {
      console.error('Error clearing photo-keywords relations:', error.message);
    }
    
    await this.safelyTruncateTable('collection_photos');
    await this.safelyTruncateTable('photo');
    await this.safelyTruncateTable('collections');
    await this.safelyTruncateTable('users');
    
    // Удаляем ключевые слова через DELETE, а не TRUNCATE для более надежной очистки
    try {
      await this.keyWordRepository.query('DELETE FROM keywords');
      console.log('Keywords cleared');
    } catch (error) {
      console.error('Error clearing keywords:', error.message);
    }
    
    console.log('Database cleared');
  }
  
  private async safelyTruncateTable(tableName: string) {
    try {
      // Проверяем существование таблицы перед очисткой
      const tableExists = await this.userRepository.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        );`
      );
      
      if (tableExists[0].exists) {
        await this.userRepository.query(`TRUNCATE "${tableName}" CASCADE`);
        console.log(`Table ${tableName} truncated`);
      } else {
        console.log(`Table ${tableName} does not exist, skipping`);
      }
    } catch (error) {
      console.error(`Error truncating table ${tableName}: ${error.message}`);
    }
  }

  private async createKeywords(): Promise<KeyWord[]> {
    console.log('Creating keywords...');
    const keywordNames = [
      'nature', 'urban', 'portrait', 'landscape', 'wildlife', 
      'travel', 'architecture', 'food', 'fashion', 'art', 
      'street', 'macro', 'night', 'abstract', 'black and white'
    ];
    
    const keywords: KeyWord[] = [];
    
    for (const name of keywordNames) {
      try {
        // Проверяем, существует ли уже такое ключевое слово
        const existingKeyword = await this.keyWordRepository.findOne({ 
          where: { name }
        });
        
        if (existingKeyword) {
          console.log(`Keyword "${name}" already exists, skipping creation`);
          keywords.push(existingKeyword);
        } else {
      const keyword = new KeyWord();
      keyword.name = name;
      keywords.push(await this.keyWordRepository.save(keyword));
          console.log(`Created keyword "${name}"`);
        }
      } catch (error) {
        console.error(`Error creating keyword "${name}": ${error.message}`);
      }
    }
    
    console.log(`Using ${keywords.length} keywords for seeding`);
    return keywords;
  }

  private async createUsers(keywords: KeyWord[]): Promise<User[]> {
    console.log('Creating users...');
    const users: User[] = [];
    const totalUsers = 10;
    
    const admin = new User();
    admin.email = 'admin@innogram.com';
    admin.username = 'admin';
    admin.password = await bcrypt.hash('admin123', 10);
    admin.role = UserRole.ADMIN;
    admin.interests = faker.helpers.arrayElements(keywords, faker.number.int({ min: 2, max: 5 }));
    
    const adminAvatarUrl = 'https://i.pravatar.cc/500?img=1';
    admin.avatarKey = await this.downloadAndUploadImage(adminAvatarUrl);
    
    users.push(await this.userRepository.save(admin));
    
    for (let i = 0; i < totalUsers - 1; i++) {
      const user = new User();
      user.email = faker.internet.email().toLowerCase();
      user.username = faker.internet.userName().toLowerCase();
      user.password = await bcrypt.hash('password123', 10);
      user.role = UserRole.USER;
      user.interests = faker.helpers.arrayElements(keywords, faker.number.int({ min: 1, max: 7 }));
      
      const avatarId = i + 2;
      const avatarUrl = `https://i.pravatar.cc/500?img=${avatarId}`;
      user.avatarKey = await this.downloadAndUploadImage(avatarUrl);
      
      users.push(await this.userRepository.save(user));
    }
    
    console.log(`Created ${users.length} users`);
    return users;
  }

  private async createPhotos(users: User[], keywords: KeyWord[]): Promise<Photo[]> {
    console.log('Creating photos...');
    const photos: Photo[] = [];
    const photosPerUser = faker.number.int({ min: 3, max: 8 });
    
    // Список URL изображений, которые точно работают
    const imageUrls = [
      'https://images.pexels.com/photos/326055/pexels-photo-326055.jpeg',
      'https://images.pexels.com/photos/733856/pexels-photo-733856.jpeg',
      'https://images.pexels.com/photos/1438761/pexels-photo-1438761.jpeg',
      'https://images.pexels.com/photos/747964/pexels-photo-747964.jpeg',
      'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
      'https://images.pexels.com/photos/1465904/pexels-photo-1465904.jpeg',
      'https://images.pexels.com/photos/1172064/pexels-photo-1172064.jpeg',
      'https://images.pexels.com/photos/586687/pexels-photo-586687.jpeg',
      'https://images.pexels.com/photos/1152359/pexels-photo-1152359.jpeg',
      'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg'
    ];
    
    for (const user of users) {
      const userPhotosCount = faker.number.int({ min: 2, max: photosPerUser });
      
      for (let i = 0; i < userPhotosCount; i++) {
        const photo = new Photo();
        photo.description = faker.lorem.sentence();
        photo.is_public = faker.datatype.boolean(0.8); 
        photo.user = user;
        
        photo.keyWords = faker.helpers.arrayElements(
          keywords, 
          faker.number.int({ min: 1, max: 4 })
        );
        
        const imageUrl = faker.helpers.arrayElement(imageUrls);
        
        try {
          photo.key = await this.downloadAndUploadImage(imageUrl);
          photos.push(await this.photoRepository.save(photo));
        } catch (error) {
          console.error(`Failed to download/upload image: ${error.message}`);
        }
      }
    }
    
    console.log(`Created ${photos.length} photos`);
    return photos;
  }

  private async createCollections(users: User[], photos: Photo[]): Promise<void> {
    console.log('Creating collections...');
    const collectionsCount = users.length * 2;
    let createdCollections = 0;
    
    for (const user of users) {
      const userCollectionsCount = faker.number.int({ min: 1, max: 3 });
      
      for (let i = 0; i < userCollectionsCount; i++) {
        const collection = new Collection();
        collection.name = faker.lorem.words(faker.number.int({ min: 1, max: 3 }));
        collection.isPublic = faker.datatype.boolean(0.7);
        collection.user = user;
        
        const userPhotos = photos.filter(photo => photo.user.id === user.id);
        const otherPhotos = photos.filter(photo => photo.user.id !== user.id && photo.is_public);
        
        const collectionPhotos = [
          ...faker.helpers.arrayElements(userPhotos, Math.min(userPhotos.length, 3)),
          ...faker.helpers.arrayElements(otherPhotos, faker.number.int({ min: 0, max: 5 }))
        ];
        
        if (collectionPhotos.length > 0) {
          collection.photos = collectionPhotos;
          
          const photoOrder = {};
          collectionPhotos.forEach((photo, index) => {
            photoOrder[photo.id] = index;
          });
          collection.photoOrder = photoOrder;
          
          await this.collectionRepository.save(collection);
          createdCollections++;
        }
      }
    }
    
    console.log(`Created ${createdCollections} collections`);
  }

  private async createInteractions(users: User[], photos: Photo[]): Promise<void> {
    console.log('Creating interactions (likes, comments, favorites)...');
    let likesCount = 0;
    let commentsCount = 0;
    let favoritesCount = 0;
    
    for (const photo of photos) {
      const interactionsCount = faker.number.int({ 
        min: 0, 
        max: Math.floor(users.length * 0.7) 
      });
      
      const interactingUsers = faker.helpers.arrayElements(
        users.filter(user => user.id !== photo.user.id),
        interactionsCount
      );
      
      for (const user of interactingUsers) {
        if (faker.datatype.boolean(0.8)) {
          const like = new Like();
          like.user = user;
          like.photo = photo;
          await this.likeRepository.save(like);
          likesCount++;
        }
        
        if (faker.datatype.boolean(0.3)) {
          const favorite = new Favorite();
          favorite.user = user;
          favorite.photo = photo;
          await this.favoriteRepository.save(favorite);
          favoritesCount++;
        }
      }

      await this.generateCommentsForPhoto(photo, users);
      commentsCount += 30;
    }
    
    console.log(`Created ${likesCount} likes, ${commentsCount} comments, ${favoritesCount} favorites`);
  }

  private async generateCommentsForPhoto(photo: Photo, users: User[]): Promise<void> {
    const commentTemplates = [
      "Замечательная фотография! {adjective} {noun}.",
      "Очень {adjective} снимок. Мне нравится {noun}.",
      "Какой {adjective} кадр! {exclamation}",
      "Это потрясающе! {question}",
      "{exclamation} Как тебе удалось поймать такой {adjective} момент?",
      "Мне очень нравится {noun} на этом фото!",
      "Отличная композиция! {adjective} работа.",
      "Просто {adjective}! Нет слов.",
      "{question} {adjective} фотография!",
      "Я бы хотел(а) научиться так фотографировать. {adjective} результат!",
      "Серьезно, это {adjective} фото. {exclamation}",
      "Какая {adjective} атмосфера на фото!",
      "Цвета просто {adjective}! {exclamation}",
      "Мне нравится {noun} и {noun} в этом кадре.",
      "Отличный ракурс! {adjective} идея.",
      "Beautiful photo! The {noun} looks {adjective}.",
      "I really like the {noun} in this picture. {exclamation}",
      "This is {adjective}! How did you capture this?",
      "The composition is {adjective}. Nice work!",
      "What a {adjective} shot! {exclamation}",
      "The lighting is perfect! {adjective} mood.",
      "I love how you captured the {noun}. {adjective} work!",
      "This image tells a story. {adjective} concept.",
      "The colors are {adjective}! {exclamation}",
      "Such a {adjective} perspective! {question}",
      "The {noun} looks amazing in this light.",
      "Stunning {noun}! {exclamation}",
      "I'm impressed by the {noun}. {adjective} shot!",
      "This is why I follow your work. {adjective} as always!",
      "How did you edit this? {adjective} result!"
    ];

    const adjectives = [
      "прекрасный", "удивительный", "великолепный", "потрясающий", "невероятный",
      "завораживающий", "впечатляющий", "гениальный", "изысканный", "вдохновляющий",
      "уникальный", "креативный", "атмосферный", "гармоничный", "стильный",
      "красочный", "выразительный", "сказочный", "драматичный", "эмоциональный",
      "stunning", "amazing", "gorgeous", "breathtaking", "incredible",
      "mesmerizing", "impressive", "brilliant", "exquisite", "inspiring",
      "unique", "creative", "atmospheric", "harmonious", "stylish",
      "colorful", "expressive", "magical", "dramatic", "emotional"
    ];

    const nouns = [
      "композиция", "цвета", "свет", "ракурс", "момент",
      "атмосфера", "детали", "контраст", "перспектива", "текстура",
      "настроение", "эмоция", "глубина", "экспозиция", "баланс",
      "сюжет", "идея", "реализация", "концепция", "видение",
      "composition", "colors", "light", "angle", "moment",
      "atmosphere", "details", "contrast", "perspective", "texture",
      "mood", "emotion", "depth", "exposure", "balance",
      "storyline", "idea", "execution", "concept", "vision"
    ];

    const exclamations = [
      "Вау!", "Невероятно!", "Потрясающе!", "Великолепно!", "Обалденно!", 
      "Супер!", "Фантастика!", "Удивительно!", "Браво!", "Шедевр!",
      "Wow!", "Incredible!", "Amazing!", "Fantastic!", "Awesome!",
      "Brilliant!", "Stunning!", "Superb!", "Bravo!", "Masterpiece!"
    ];

    const questions = [
      "Какая камера у тебя?", "Где это снято?", "Как ты это сделал(а)?", "Какие настройки использовал(а)?",
      "Сколько времени ушло на обработку?", "Какой объектив использовал(а)?", "Это естественное освещение?",
      "Можешь поделиться секретами обработки?", "Это фотошоп или оригинал?", "В какое время суток снято?",
      "What camera did you use?", "Where was this taken?", "How did you do this?", "What settings did you use?",
      "How long did it take to edit?", "What lens did you use?", "Is this natural lighting?",
      "Can you share your editing secrets?", "Is this photoshopped or original?", "What time of day was this shot?"
    ];

    for (let i = 0; i < 100; i++) {
      const comment = new Comment();
      comment.user = faker.helpers.arrayElement(users);
      comment.photo = photo;
      
      const template = faker.helpers.arrayElement(commentTemplates);
      let text = template
        .replace('{adjective}', faker.helpers.arrayElement(adjectives))
        .replace('{noun}', faker.helpers.arrayElement(nouns))
        .replace('{exclamation}', faker.helpers.arrayElement(exclamations))
        .replace('{question}', faker.helpers.arrayElement(questions));
      
      if (text.includes('{adjective}')) {
        text = text.replace('{adjective}', faker.helpers.arrayElement(adjectives));
      }
      if (text.includes('{noun}')) {
        text = text.replace('{noun}', faker.helpers.arrayElement(nouns));
      }
      
      comment.text = text;
      
      const createdAt = faker.date.recent({ days: 30 });
      comment.createdAt = createdAt;
      
      await this.commentRepository.save(comment);
    }
  }

  private async downloadAndUploadImage(imageUrl: string): Promise<string> {
    try {
      const response = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
          'Referer': 'https://www.google.com/'
        },
        maxRedirects: 5,
        timeout: 10000
      });
      
      const buffer = Buffer.from(response.data, 'binary');
      
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFilePath = path.join(tempDir, `temp_${Date.now()}.jpg`);
      fs.writeFileSync(tempFilePath, buffer);
      
      const file: Express.Multer.File = {
        fieldname: 'image',
        originalname: `image_${Date.now()}.jpg`,
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: buffer,
        size: buffer.length,
        stream: null,
        destination: '',
        filename: '',
        path: tempFilePath
      };
      
      const key = await this.s3Service.uploadFile(file);
      
      fs.unlinkSync(tempFilePath);
        
      return key;
    } catch (error) {
      console.error(`Error downloading/uploading image: ${error.message}`);
      throw error;
    }
  }
} 
