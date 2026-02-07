import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from '../entities/pet.entity';

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
  ) {}

  async findAll(userId: string) {
    return this.petRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const pet = await this.petRepository.findOne({
      where: { id, userId },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    return pet;
  }

  async create(userId: string, petData: any) {
    const pet = this.petRepository.create({
      ...petData,
      userId,
    });

    return this.petRepository.save(pet);
  }

  async update(id: string, userId: string, petData: any) {
    const pet = await this.findOne(id, userId);
    
    Object.assign(pet, petData);
    return this.petRepository.save(pet);
  }

  async remove(id: string, userId: string) {
    const pet = await this.findOne(id, userId);
    await this.petRepository.remove(pet);
    return { success: true };
  }
}
