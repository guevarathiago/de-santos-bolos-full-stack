import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UserUuidAndRole1791849600001 implements MigrationInterface {
    name = 'UserUuidAndRole1791849600001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "User" ALTER COLUMN "id" TYPE UUID USING "id"::uuid`);
        await queryRunner.query(`ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);

        await queryRunner.query(`CREATE TYPE "user_role" AS ENUM ('ADMIN', 'USER')`);
        await queryRunner.query(`ALTER TABLE "User" ADD COLUMN "role" "user_role" NOT NULL DEFAULT 'USER'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "User" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "user_role"`);

        await queryRunner.query(`ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "User" ALTER COLUMN "id" TYPE TEXT`);
    }
}
