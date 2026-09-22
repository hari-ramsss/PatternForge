import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, targetCompanies, preferredLanguage, daysToInterview } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: {
          create: {
            targetCompanies,
            preferredLanguage,
            daysToInterview,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      token,
    };
  }

  async getStreak(userId: string) {
    // Streak = consecutive calendar days (UTC) with at least one accepted submission.
    const accepted = await this.prisma.submission.findMany({
      where: { userId, status: 'ACCEPTED' },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const days = Array.from(
      new Set(accepted.map((s) => s.createdAt.toISOString().slice(0, 10))),
    ).sort();

    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const today = dayKey(new Date());
    const yesterday = dayKey(new Date(Date.now() - 86_400_000));

    let currentStreak = 0;
    if (days.length > 0 && (days[days.length - 1] === today || days[days.length - 1] === yesterday)) {
      currentStreak = 1;
      const msPerDay = 86_400_000;
      let prev = new Date(`${days[days.length - 1]}T00:00:00Z`).getTime();
      for (let i = days.length - 2; i >= 0; i--) {
        const cur = new Date(`${days[i]}T00:00:00Z`).getTime();
        if (prev - cur === msPerDay) {
          currentStreak++;
          prev = cur;
        } else {
          break;
        }
      }
    }

    // Longest streak: walk all active days
    let longestStreak = 0;
    let run = 0;
    const msPerDay = 86_400_000;
    for (let i = 0; i < days.length; i++) {
      if (i > 0 && new Date(`${days[i]}T00:00:00Z`).getTime() - new Date(`${days[i - 1]}T00:00:00Z`).getTime() === msPerDay) {
        run++;
      } else {
        run = 1;
      }
      if (run > longestStreak) longestStreak = run;
    }

    const lastActiveDate = days.length > 0 ? days[days.length - 1] : null;
    const solvedToday = lastActiveDate === today;

    return { currentStreak, longestStreak, solvedToday, lastActiveDate };
  }
}
