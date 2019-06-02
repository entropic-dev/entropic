import * as React from 'react';
import { Link } from '@reach/router';
import styled from 'styled-components';
import { darken } from 'polished';
import { COLORS } from '../../constants';

const Header = () => (
  <Wrapper>
    <Link to="/">entropic</Link>
  </Wrapper>
);

const Wrapper = styled.header`
  background: ${COLORS.yellow};
  color: ${COLORS.black};
  border-bottom: 4px solid ${darken(0.17, COLORS.yellow)};

  font-size: 26px;
  font-weight: 700;

  padding: 1rem;

  a {
    display: inline-block;
    color: ${COLORS.black};
    text-decoration: none;

    transition: transform 200ms ease-out;
    &:hover {
      transform: scale(1.08) rotate(-5deg);
    }
  }
`;

export default Header;
