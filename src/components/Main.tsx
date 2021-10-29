import React from 'react';
import Nav from './Nav';
import Filter from './Filter';

function Main() {
  return (
    <section className="flex flex-col items-stretch h-screen">
      <Nav />
      <Filter />
    </section>
  );
}

export default Main;
