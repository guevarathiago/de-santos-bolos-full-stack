import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Conversations1792627200000 implements MigrationInterface {
    name = 'Conversations1792627200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "Conversation" (
                "id" UUID NOT NULL DEFAULT gen_random_uuid(),
                "userId" UUID NOT NULL,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId")
                    REFERENCES "User" ("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`CREATE INDEX "Conversation_userId_idx" ON "Conversation" ("userId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "Conversation"`);
    }
}
