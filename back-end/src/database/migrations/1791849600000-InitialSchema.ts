import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1791849600000 implements MigrationInterface {
    name = 'InitialSchema1791849600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "User" (
                "id" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "email" TEXT NOT NULL,
                "password" TEXT NOT NULL,
                "cep" TEXT NOT NULL,
                "celular" TEXT NOT NULL,
                CONSTRAINT "User_pkey" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User" ("email")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "User"`);
    }
}
