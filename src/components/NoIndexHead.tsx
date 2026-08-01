import { Helmet } from "react-helmet-async";

export const NoIndexHead = () => {
  return (
    <Helmet>
      <meta name="robots" content="noindex,nofollow" />
    </Helmet>
  );
};
