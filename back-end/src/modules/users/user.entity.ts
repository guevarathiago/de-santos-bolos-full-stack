import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

// Table name kept as "User" to preserve the schema created by Prisma.
@Entity({ name: 'User' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    name!: string;

    @Index('User_email_key', { unique: true })
    @Column('text')
    email!: string;

    @Column('text', { select: false })
    password!: string;

    @Column('text')
    cep!: string;

    @Column('text')
    celular!: string;

    @Column({ type: 'enum', enum: UserRole, enumName: 'user_role', default: UserRole.USER })
    role!: UserRole;
}
