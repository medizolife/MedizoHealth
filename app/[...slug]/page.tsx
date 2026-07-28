'use client';
import dynamic from 'next/dynamic';

const App = dynamic(() => import('../../src/App'), { 
  ssr: false,
  loading: () => <div style={{ minHeight: '100vh', backgroundColor: '#F4F8F6' }} />
});

export default function CatchAllPage() {
  return <App />;
}
