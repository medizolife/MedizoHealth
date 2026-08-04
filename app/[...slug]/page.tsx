import ClientWrapper from './ClientWrapper';

export function generateStaticParams() {
  return [
    { slug: ['login'] },
    { slug: ['register'] },
    { slug: ['dashboard'] },
    { slug: ['home'] },
    { slug: ['profile'] },
    { slug: ['patients'] },
    { slug: ['prescriptions'] },
    { slug: ['prescriptions', 'new'] },
    { slug: ['prescriptions', 'all'] },
    { slug: ['prescriptions', 'view'] },
    { slug: ['unauthorized'] },
    { slug: ['privacy-policy'] },
    { slug: ['terms'] }
  ];
}

export default function CatchAllPage() {
  return <ClientWrapper />;
}


