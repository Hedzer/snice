import type { Principal } from '../types/auth';

export const isAuthenticated = (ctx: any, _params: any) => {
  const principal = ctx.principal as Principal | undefined;
  return principal?.isAuthenticated === true;
};
