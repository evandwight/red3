import React from 'react';
import { render, screen } from '@testing-library/react';
import ListingApp from './ListingApp';

test('renders learn react link', () => {
  render(<ListingApp />);
  const linkElement = screen.getByText(/alive/i);
  expect(linkElement).toBeInTheDocument();
});
