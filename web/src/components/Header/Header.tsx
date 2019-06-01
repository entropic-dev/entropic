import * as React from 'react';
import styled from 'styled-components';
import { darken } from 'polished';
import { COLORS } from '../../constants';

const Header = () => <Wrapper>entropic</Wrapper>;

const Wrapper = styled.header`
  background: ${COLORS.yellow};
  color: ${COLORS.black};
  border-bottom: 4px solid ${darken(0.17, COLORS.yellow)};

  font-size: 26px;
  font-weight: 700;

  padding: 1rem;
`;

export default Header;
