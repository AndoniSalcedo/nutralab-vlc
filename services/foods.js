import { getFoodsAction } from '@/actions/foodActions';

export async function getFoods() {
  return await getFoodsAction();
}
