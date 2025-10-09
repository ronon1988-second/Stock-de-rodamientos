import { config } from 'dotenv';
config({ path: '.env' });

import '@/ai/flows/reorder-recommendations.ts';
import '@/app/actions';
import '@/firebase/server-app';
