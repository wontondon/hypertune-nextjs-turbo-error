import 'server-only';
import { unstable_noStore as noStore } from 'next/cache';
import { createSource } from '../../generated/hypertune';

const hypertuneSource = createSource({
  token: process.env.NEXT_PUBLIC_HYPERTUNE_TOKEN!,
});

export default async function getHypertune() {
  noStore();
  await hypertuneSource.initIfNeeded(); // Check for flag updates

  return hypertuneSource.root({
    args: {
      context: {
        environment: 'local',
        user: { id: '1', name: 'Test', email: 'hi@test.com' },
        // Set placeholder values for browser-only args, e.g.
        // browserOnlyId: "",
      },
    },
  });
}
