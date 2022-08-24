import {computeCollapseInitial} from './PostDetailsApp';

function cn(collapseOrder, children:any=[]) {
    return {id:collapseOrder, collapseOrder, children}
}

test('computeCollapseInitial', () => {
  const collapseInitial = computeCollapseInitial([cn(1,[cn(2), cn(51)]), cn(52)], null);
  expect(collapseInitial).toEqual({"null":true, 1:true});
});
