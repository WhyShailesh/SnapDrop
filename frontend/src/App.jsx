import { useState } from 'react';
import UploadFlow from './components/UploadFlow';
import ReceiveFlow from './components/ReceiveFlow';
import Header from './components/Header';

export default function App() {
  const [tab, setTab] = useState('send'); // send | receive

  return (
    <div className="min-h-screen flex flex-col">
      <Header tab={tab} setTab={setTab} />
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        {tab === 'send' ? <UploadFlow /> : <ReceiveFlow />}
      </main>
    </div>
  );
}
