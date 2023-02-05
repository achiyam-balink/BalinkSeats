import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt/dist';

import * as bcrypt from 'bcrypt';
import { LoginUserDto } from '../../dto';
import { RegisterUserDto } from '../../dto';
import { EmployeeService } from '../employee/employee.service';
import { UserDetails } from '../user/user.interface';

import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    @Inject(EmployeeService) private readonly employeeService: EmployeeService,
    private readonly jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async registerUser(
    user: Readonly<RegisterUserDto>,
  ): Promise<UserDetails | { ERROR: string }> {
    const { email, password } = user;
    const employee = await this.employeeService.findEmployee({
      email,
    });
    if (!employee || employee.ERROR)
      return (
        { ERROR: employee?.ERROR } || {
          ERROR: 'No employee found with that email',
        }
      );

    const existingUser = await this.userService.findUserByEmployee(employee);
    if (existingUser) return { ERROR: 'Email already in use' };

    const firstName = employee.firstName;
    const lastName = employee.lastName;
    if (firstName !== user.firstName || lastName !== user.lastName)
      return {
        ERROR:
          'First or/and last name do not match the employee record for this email',
      };

    const hashedPassword = await this.hashPassword(password);
    const newUser = await this.userService.createUser(employee, hashedPassword);
    return this.userService._getUserDetails(newUser);
  }

  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserDetails | any> {
    const employee = await this.employeeService.findEmployee({
      email,
    });
    if (!employee || employee.ERROR)
      return { ERROR: employee?.ERROR } || { ERROR: 'User not found' };

    const user = await this.userService.findUserByEmployee(employee);
    if (!user) return { ERROR: 'User not found' };

    const isValid = await this.validatePassword(password, user.password);
    if (!isValid) return { ERROR: 'Invalid password' };

    return this.userService._getUserDetails(user);
  }

  async loginUser(existingUser: LoginUserDto): Promise<
    | {
        token: string;
        name: string;
        email: string;
      }
    | { ERROR: string }
  > {
    const { email, password } = existingUser;
    const user = await this.validateUser(email, password);

    if (user?.ERROR) return { ERROR: user.ERROR };

    const jwt = await this.jwtService.signAsync({ user });
    return {
      token: jwt,
      email,
      name: user.name,
    };
  }
}
