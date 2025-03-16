import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePhotoAndUserEntities1742150601476
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "username" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'user',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_username" UNIQUE ("username")
      );
      
      CREATE TABLE "photos" (
        "id" SERIAL NOT NULL,
        "description" character varying NOT NULL,
        "key" character varying NOT NULL,
        "is_public" boolean NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" uuid,
        CONSTRAINT "PK_photos_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_photos_key" UNIQUE ("key"),
        CONSTRAINT "FK_photos_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "photos";
      DROP TABLE "users";
    `);
  }
}
