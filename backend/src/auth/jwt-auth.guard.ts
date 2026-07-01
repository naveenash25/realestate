import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Seeded dev users — mirrors backend/src/database/seeds/001_sample_data.sql.
// Switch active user per-request with the X-Dev-User header (any id below).
const DEV_USERS: Record<string, { id: string; role: string; phone?: string; email?: string }> = {
  // buyers
  'b1000000-0000-4000-8000-000000000001': { id: 'b1000000-0000-4000-8000-000000000001', role: 'buyer', phone: '+919876501001', email: 'rahul.sharma@gmail.com' },
  'b2000000-0000-4000-8000-000000000002': { id: 'b2000000-0000-4000-8000-000000000002', role: 'buyer', phone: '+919876501002', email: 'priya.reddy@gmail.com'  },
  'b3000000-0000-4000-8000-000000000003': { id: 'b3000000-0000-4000-8000-000000000003', role: 'buyer', phone: '+919876501003', email: 'arun.kumar@gmail.com'   },
  // owners — Hyderabad
  'a1000000-0000-4000-8000-000000000001': { id: 'a1000000-0000-4000-8000-000000000001', role: 'owner', email: 'venkat.rao.hyd@gmail.com'    },
  'a2000000-0000-4000-8000-000000000002': { id: 'a2000000-0000-4000-8000-000000000002', role: 'owner', email: 'kavitha.reddy.hyd@gmail.com' },
  // owners — Pune
  'a3000000-0000-4000-8000-000000000003': { id: 'a3000000-0000-4000-8000-000000000003', role: 'owner', email: 'suresh.desai.pun@gmail.com'  },
  'a4000000-0000-4000-8000-000000000004': { id: 'a4000000-0000-4000-8000-000000000004', role: 'owner', email: 'anita.joshi.pun@gmail.com'   },
  // owners — Jaipur
  'a5000000-0000-4000-8000-000000000005': { id: 'a5000000-0000-4000-8000-000000000005', role: 'owner', email: 'rajesh.sharma.jai@gmail.com' },
  'a6000000-0000-4000-8000-000000000006': { id: 'a6000000-0000-4000-8000-000000000006', role: 'owner', email: 'sunita.meena.jai@gmail.com'  },
  // owners — Coimbatore
  'a7000000-0000-4000-8000-000000000007': { id: 'a7000000-0000-4000-8000-000000000007', role: 'owner', email: 'murugan.rajan.cbe@gmail.com' },
  'a8000000-0000-4000-8000-000000000008': { id: 'a8000000-0000-4000-8000-000000000008', role: 'owner', email: 'lakshmi.sub.cbe@gmail.com'   },
  // admin
  'ad000000-0000-4000-8000-000000000001': { id: 'ad000000-0000-4000-8000-000000000001', role: 'admin', email: 'admin@realestate.app' },
};

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(ctx: ExecutionContext) {
    if (process.env.NODE_ENV !== 'development') {
      return super.canActivate(ctx);
    }

    const req = ctx.switchToHttp().getRequest();
    const requestedId = req.headers['x-dev-user'] as string | undefined;
    const defaultId = process.env.DEV_DEFAULT_USER_ID ?? 'b1000000-0000-4000-8000-000000000001';
    req.user = DEV_USERS[requestedId ?? defaultId] ?? DEV_USERS[defaultId];
    return true;
  }
}
