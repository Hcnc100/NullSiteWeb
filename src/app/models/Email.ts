export interface Email {
  readonly email: string;
  readonly name: string;
  readonly subject: string;
  readonly message: string;
  readonly isOpen: boolean;
  readonly createdAt?: any;
  readonly updatedAt?: any;
}
