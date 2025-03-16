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

@Injectable()
export class UserService {
  constructor(
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,
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
    });
  }
}
