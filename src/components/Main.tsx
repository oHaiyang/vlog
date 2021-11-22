import React from 'react';
import Nav from './Nav';
import Filter from './Filter';
import Detail from './Detail';
import { useRows } from '../hooks';

function Main() {
  const [rows, selecting, select] = useRows();

  return (
    <section className="flex flex-col items-stretch h-screen">
      <Nav />
      <Filter 
        handleSelect={select}
      />
      <Detail 
        rows={rows}
        selecting={selecting}
      />
    </section>
  );
}

export default Main;
