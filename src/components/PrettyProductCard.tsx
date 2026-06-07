// Unified product card — all product cards across the site render identically.
import ProductCard from './ProductCard';

type Props = {
  product: any;
  badgeLabel?: string;
  badgeClass?: string;
};

const PrettyProductCard = ({ product }: Props) => {
  return <ProductCard product={product} />;
};

export default PrettyProductCard;
