import { useEffect, useState } from 'react';
import { useNuiEvent } from './hooks/useNuiEvent';
import { fetchNui } from './utils/fetchNui';
import { isEnvBrowser } from './utils/misc';
import { HotWire } from './components/HotWire'

const App: React.FC = () => {
  const [visible, setVisible] = useState(isEnvBrowser());
  useEffect(() => {
    fetchNui('init');
  }, []);
  useNuiEvent('startGame', () => {
    setVisible(true);
  });
  useNuiEvent('closeUi', () => {
    setVisible(false);
  });
  return visible ? (
    <HotWire />
  ) : (
    <></>
  );
};

export default App;
