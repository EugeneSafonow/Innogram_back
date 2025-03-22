import { Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';

export class TagService {
  constructor(
    @Inject('TAGS_REPOSITORY')
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async createTag(name: string): Promise<Tag> {
    const tag = this.tagRepository.create({ name });
    return this.tagRepository.save(tag);
  }

  async getAllTags(): Promise<Tag[]> {
    return this.tagRepository.find();
  }

  async findTagByName(name: string): Promise<Tag | null> {
    return this.tagRepository.findOne({ where: { name } });
  }

  async findOrCreateTag(name: string): Promise<Tag> {
    let tag = await this.findTagByName(name);
    if (!tag) {
      tag = await this.createTag(name);
    }
    return tag;
  }
}
