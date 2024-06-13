import getHypertune from '~/lib/getHypertune';

export default async function Home() {
  const hypertune = await getHypertune();

  const exampleFlag = hypertune.showPlanManagement({ fallback: false });

  return <div>Example Flag: {String(exampleFlag)}</div>;
}
