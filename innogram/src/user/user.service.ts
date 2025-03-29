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

@Injectable()
export class UserService {
  constructor(
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,
    private readonly keyWordService: KeyWordService,
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

  async findByPayload({ username }: any): Promise<User> {
    return this.userRepository.findOne({ where: { username } });
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

  async updateUser(updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(updateUserDto.userId);

    if (updateUserDto.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });

      if (existingUser && existingUser.id !== updateUserDto.userId) {
        throw new BadRequestException('Username already taken');
      }

      user.username = updateUserDto.username;
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
}
