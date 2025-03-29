import { Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { KeyWord } from '../entities/keyWord.entity';

export class KeyWordService {
  constructor(
    @Inject('KEY_WORD_REPOSITORY')
    private readonly keyWordRepository: Repository<KeyWord>,
  ) {}

  async createKeyWord(name: string): Promise<KeyWord> {
    const keyWord = this.keyWordRepository.create({ name });
    return this.keyWordRepository.save(keyWord);
  }

  async getAllKeyWords(): Promise<KeyWord[]> {
    return this.keyWordRepository.find();
  }

  async findKeyWordByName(name: string): Promise<KeyWord | null> {
    return this.keyWordRepository.findOne({ where: { name } });
  }

  async findOrCreateKeyWord(name: string): Promise<KeyWord> {
    let keyWord = await this.findKeyWordByName(name);
    if (!keyWord) {
      keyWord = await this.createKeyWord(name);
    }
    return keyWord;
  }
}
