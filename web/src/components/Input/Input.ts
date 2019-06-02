import styled from 'styled-components';
import { COLORS } from '../../constants';

const Input = styled.input`
  padding: 12px 18px;
  background: #fff;
  border: 2px solid #bbb;
  border-radius: 4px;
  width: 100%;

  &:focus {
    border: 2px solid ${COLORS.yellow};
    outline: 0;
  }
`;

export default Input;
