import * as React from 'react';
import styled from 'styled-components';
import { COLORS } from '../../constants';

const Hero = () => (
  <>
    <Well>
      <Big>entropic</Big>
      <Small>federated package registry</Small>
    </Well>
    <Hostname>
      <Muted>registry host:</Muted> host.registry.co
    </Hostname>
  </>
);

const Well = styled.div`
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;

  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 2rem 1rem;
`;

const Big = styled.span`
  font-size: 72px;
  font-weight: 700;
  color: ${COLORS.yellow};
  text-transform: uppercase;
`;

const Small = styled.span`
  font-size: 36px;
  color: ${COLORS.white};
`;

const Hostname = styled.div`
  color: ${COLORS.white};
  font-size: 24px;
  font-weight: 700;

  text-align: center;
  margin: 2rem 0;
`;

const Muted = styled.span`
  opacity: 0.6;
`;

export default Hero;
