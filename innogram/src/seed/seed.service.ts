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
    await this.safelyTruncateTable('key_word');
    await this.safelyTruncateTable('collection_photos');
    await this.safelyTruncateTable('photo');
    await this.safelyTruncateTable('collections');
    await this.safelyTruncateTable('users');
    
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
      const keyword = new KeyWord();
      keyword.name = name;
      keywords.push(await this.keyWordRepository.save(keyword));
    }
    
    console.log(`Created ${keywords.length} keywords`);
    return keywords;
  }

  private async createUsers(keywords: KeyWord[]): Promise<User[]> {
    console.log('Creating users...');
    const users: User[] = [];
    const totalUsers = 10;
    
    // Создаем админа
    const admin = new User();
    admin.email = 'admin@innogram.com';
    admin.username = 'admin';
    admin.password = await bcrypt.hash('admin123', 10);
    admin.role = UserRole.ADMIN;
    admin.interests = faker.helpers.arrayElements(keywords, faker.number.int({ min: 2, max: 5 }));
    
    // Загрузка аватара для админа
    const adminAvatarUrl = 'https://i.pravatar.cc/500?img=1';
    admin.avatarKey = await this.downloadAndUploadImage(adminAvatarUrl);
    
    users.push(await this.userRepository.save(admin));
    
    // Создаем обычных пользователей
    for (let i = 0; i < totalUsers - 1; i++) {
      const user = new User();
      user.email = faker.internet.email().toLowerCase();
      user.username = faker.internet.userName().toLowerCase();
      user.password = await bcrypt.hash('password123', 10);
      user.role = UserRole.USER;
      user.interests = faker.helpers.arrayElements(keywords, faker.number.int({ min: 1, max: 7 }));
      
      // Загрузка случайного аватара
      const avatarId = i + 2; // Начинаем с 2, т.к. 1 уже использован для админа
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
        photo.is_public = faker.datatype.boolean(0.8); // 80% фото публичные
        photo.user = user;
        
        // Выбираем случайные ключевые слова
        photo.keyWords = faker.helpers.arrayElements(
          keywords, 
          faker.number.int({ min: 1, max: 4 })
        );
        
        // Используем заранее подготовленные URL изображений
        const imageUrl = faker.helpers.arrayElement(imageUrls);
        
        try {
          photo.key = await this.downloadAndUploadImage(imageUrl);
          photos.push(await this.photoRepository.save(photo));
        } catch (error) {
          console.error(`Failed to download/upload image: ${error.message}`);
          // Пропускаем это фото и продолжаем
        }
      }
    }
    
    console.log(`Created ${photos.length} photos`);
    return photos;
  }

  private async createCollections(users: User[], photos: Photo[]): Promise<void> {
    console.log('Creating collections...');
    const collectionsCount = users.length * 2; // в среднем 2 коллекции на пользователя
    let createdCollections = 0;
    
    for (const user of users) {
      const userCollectionsCount = faker.number.int({ min: 1, max: 3 });
      
      for (let i = 0; i < userCollectionsCount; i++) {
        const collection = new Collection();
        collection.name = faker.lorem.words(faker.number.int({ min: 1, max: 3 }));
        collection.description = faker.lorem.sentence();
        collection.isPublic = faker.datatype.boolean(0.7); // 70% коллекций публичные
        collection.user = user;
        
        // Добавляем случайные фото пользователя и других пользователей в коллекцию
        const userPhotos = photos.filter(photo => photo.user.id === user.id);
        const otherPhotos = photos.filter(photo => photo.user.id !== user.id && photo.is_public);
        
        const collectionPhotos = [
          ...faker.helpers.arrayElements(userPhotos, Math.min(userPhotos.length, 3)),
          ...faker.helpers.arrayElements(otherPhotos, faker.number.int({ min: 0, max: 5 }))
        ];
        
        if (collectionPhotos.length > 0) {
          collection.photos = collectionPhotos;
          
          // Создаем случайный порядок фотографий
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
    
    // Для каждого фото создаем лайки, комментарии и добавления в избранное
    for (const photo of photos) {
      // Определяем, сколько пользователей будут взаимодействовать с этим фото
      const interactionsCount = faker.number.int({ 
        min: 0, 
        max: Math.floor(users.length * 0.7) // максимум 70% пользователей
      });
      
      // Выбираем случайных пользователей для взаимодействия
      const interactingUsers = faker.helpers.arrayElements(
        users.filter(user => user.id !== photo.user.id), // исключаем владельца фото
        interactionsCount
      );
      
      for (const user of interactingUsers) {
        // Создаем лайк с вероятностью 80%
        if (faker.datatype.boolean(0.8)) {
          const like = new Like();
          like.user = user;
          like.photo = photo;
          await this.likeRepository.save(like);
          likesCount++;
        }
        
        // Создаем комментарий с вероятностью 40%
        if (faker.datatype.boolean(0.4)) {
          const comment = new Comment();
          comment.user = user;
          comment.photo = photo;
          comment.text = faker.lorem.sentence();
          await this.commentRepository.save(comment);
          commentsCount++;
        }
        
        // Добавляем в избранное с вероятностью 30%
        if (faker.datatype.boolean(0.3)) {
          const favorite = new Favorite();
          favorite.user = user;
          favorite.photo = photo;
          await this.favoriteRepository.save(favorite);
          favoritesCount++;
        }
      }
    }
    
    console.log(`Created ${likesCount} likes, ${commentsCount} comments, ${favoritesCount} favorites`);
  }

  private async downloadAndUploadImage(imageUrl: string): Promise<string> {
    try {
      // Загружаем изображение с правильными заголовками
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
      
      // Создаем временный файл
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFilePath = path.join(tempDir, `temp_${Date.now()}.jpg`);
      fs.writeFileSync(tempFilePath, buffer);
      
      // Создаем объект Multer.File для загрузки в S3
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
      
      // Загружаем в S3 и получаем ключ
      const key = await this.s3Service.uploadFile(file);
      
      // Удаляем временный файл
      fs.unlinkSync(tempFilePath);
      
      return key;
    } catch (error) {
      console.error(`Error downloading/uploading image: ${error.message}`);
      throw error;
    }
  }
} 
