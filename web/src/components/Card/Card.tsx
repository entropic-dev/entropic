import * as React from 'react';
import styled from 'styled-components';
import { COLORS } from '../../constants';

export interface Props {
  children: React.ReactNode;
}

const Card = ({ children }: Props) => <Wrapper>{children}</Wrapper>;

const Wrapper = styled.div`
  background: ${COLORS.white};
  color: ${COLORS.black};

  padding: 1rem;

  border-radius: 4px;
`;

export default Card;
