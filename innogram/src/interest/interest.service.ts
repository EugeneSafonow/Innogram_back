import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserService } from '../user/user.service';
import { KeyWordService } from '../keyWord/keyWordService';

@Injectable()
export class InterestService {
  constructor(
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,
    private readonly userService: UserService,
    private readonly keyWordService: KeyWordService,
  ) {}

  async updateUserInterestsByKeywords(userId: string, keyWordNames: string[]): Promise<void> {
    if (!keyWordNames || keyWordNames.length === 0) {
      return;
    }

    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.interests) {
      user.interests = [];
    }

    const currentInterests = user.interests.map((interest) => interest.name.toLowerCase());
    
    const newKeyWords = [];
    
    for (const keyWordName of keyWordNames) {
      const name = keyWordName.toLowerCase();
      if (!currentInterests.includes(name)) {
        const keyWord = await this.keyWordService.findOrCreateKeyWord(keyWordName);
        newKeyWords.push(keyWord);
      }
    }
    
    if (newKeyWords.length === 0) {
      return;
    }
    
    user.interests = [...user.interests, ...newKeyWords];
    
    if (user.interests.length > 50) {
      user.interests = user.interests.slice(0, 50);
    }
    
    await this.userRepository.save(user);
  }
  
  async updateInterestsFromFavorite(userId: string, photoKeyWords: string[]): Promise<void> {
    if (!photoKeyWords || photoKeyWords.length === 0) {
      return;
    }
    
    await this.updateUserInterestsByKeywords(userId, photoKeyWords);
  }
  
  async updateInterestsFromLike(userId: string, photoKeyWords: string[]): Promise<void> {
    if (!photoKeyWords || photoKeyWords.length === 0) {
      return;
    }
    
    await this.updateUserInterestsByKeywords(userId, photoKeyWords);
  }
  
  async getUserInterests(userId: string): Promise<string[]> {
    const user = await this.userService.findOne(userId);
    if (!user || !user.interests) {
      return [];
    }
    
    return user.interests.map(interest => interest.name);
  }
} 
