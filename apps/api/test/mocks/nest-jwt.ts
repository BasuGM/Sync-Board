export type JwtSignOptions = {
  secret?: string;
  expiresIn?: string | number;
};

export class JwtService {
  signAsync = jest.fn().mockResolvedValue('access-token');
}

export class JwtModule {
  static register() {
    return JwtModule;
  }

  static registerAsync() {
    return JwtModule;
  }
}
