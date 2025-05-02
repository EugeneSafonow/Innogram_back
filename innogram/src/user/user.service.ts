import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/createUser.dto';
import { genSalt, hash, compare } from 'bcrypt';
import { LoginUserDto } from './dto/loginUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { KeyWordService } from '../keyWord/keyWordService';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class UserService {
  constructor(
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,
    private readonly keyWordService: KeyWordService,
    private s3Service: S3Service,
  ) {}

  async findByLogin({
    emailOrUsername,
    password,
  }: LoginUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const areEqual = await compare(password, user.password);

    if (!areEqual) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  async findByPayload({ username, email, userId }: any): Promise<User> {
    if (!username || !email) {
      return null;
    }

    try {
      // If userId is provided, use it as primary search criteria
      if (userId) {
        const userById = await this.userRepository.findOne({
          where: { id: userId },
        });

        // Verify that the username and email match
        if (
          userById &&
          userById.username === username &&
          userById.email === email
        ) {
          return userById;
        }
      }

      // Fallback to search by username and email
      const user = await this.userRepository.findOne({
        where: {
          username,
          email,
        },
      });

      return user;
    } catch (error) {
      return null;
    }
  }

  async create(user: CreateUserDto): Promise<User> {
    const userInDb = await this.userRepository.findOne({
      where: [{ email: user.email }, { username: user.username }],
    });

    if (userInDb) {
      throw new BadRequestException('User already exists');
    }

    const salt = await genSalt(10);
    const hashPassword = await hash(user.password, salt);

    user.password = hashPassword;
    return this.userRepository.save(user);
  }

  async findOne(userId: string): Promise<User> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['interests'],
    });
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.avatar) {
      if (user.avatarKey) {
        await this.s3Service.deleteFile(user.avatarKey);
      }
      const avatarKey = await this.s3Service.uploadFile(updateUserDto.avatar);
      user.avatarKey = avatarKey;
    }

    if (updateUserDto.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Username already taken');
      }

      user.username = updateUserDto.username;
    }

    if (updateUserDto.email) {
      user.email = updateUserDto.email;
    }

    if (updateUserDto.role) {
      user.role = updateUserDto.role;
    }

    if (updateUserDto.interests) {
      const keyWords = await Promise.all(
        updateUserDto.interests.map(async (name) => {
          return this.keyWordService.findOrCreateKeyWord(name);
        }),
      );

      user.interests = keyWords;
    } else {
      user.interests = [];
    }

    return this.userRepository.save(user);
  }

  async changePassword(changePasswordDto: ChangePasswordDto): Promise<User> {
    const { userId, oldPassword, newPassword } = changePasswordDto;
    const user = await this.findOne(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await compare(oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Old password is incorrect');
    }

    const salt = await genSalt(10);
    user.password = await hash(newPassword, salt);

    return this.userRepository.save(user);
  }

  async searchUsers(searchTerm: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const term = `%${searchTerm.toLowerCase()}%`;

    const [users, total] = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.avatarKey', 'user.role'])
      .where('LOWER(user.username) LIKE :term', { term })
      .orderBy('user.username', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      users,
      hasMore: skip + users.length < total,
      total,
    };
  }
}
