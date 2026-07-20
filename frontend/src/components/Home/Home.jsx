import React, { useEffect } from "react";
import { useToast } from "../../hooks/useToast";
import { useGetProductsQuery } from "../../slices/productsApiSlice";
import Hero from "./Hero";
import TrustBar from "./TrustBar";
import CategoryGrid from "./CategoryGrid";
import ProductSection from "./ProductSection";
import EditorialSplit from "./EditorialSplit";
import Manifesto from "./Manifesto";
import Testimonials from "./Testimonials";
import Seo from "../Seo";
import JsonLd from "../JsonLd";
import { organizationJsonLd } from "../../utils/jsonLd";

function Home() {
  const toast = useToast();
  const { data, error } = useGetProductsQuery(12);
  const products = data?.products || [];

  useEffect(() => {
    if (error) {
      toast.error(error?.data?.message || error.message);
    }
  }, [error, toast]);

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <Seo
        title="Hverdag — Things that age with you, gently."
        description="Everyday essentials, made to last, mended when worn. A Nordic keeper's covenant."
        path="/"
      />
      <Hero />
      <TrustBar />
      <CategoryGrid products={products} />
      <ProductSection
        title="Curated for the season"
        overline="Restocked"
        products={products}
        linkTo="/products"
        linkLabel="View all"
      />
      <EditorialSplit
        overline="From the workshop"
        title="Made by hand, kept by hand."
        body="Each piece in our collection passes through the hands of an artisan we know by name. A woodworker in Värmland. A ceramicist in Provence. A linen weaver in the Belgian Ardennes. We pay them what the work is worth, visit when we can, and mend what they make — for as long as you keep it."
        ctaLabel="Meet the makers"
        ctaHref="/aboutus"
        imageSrc={products[2]?.images?.[0]?.url}
        imageAlt={products[2]?.name || "A maker at work"}
        reverse={false}
      />
      <Manifesto />
      <Testimonials />
      <EditorialSplit
        overline="The covenant"
        title="Free mending, for life."
        body="Every piece in our collection comes with a quiet promise: when it wears, we'll mend it. Wood re-oiled. Ceramic re-glazed. Linen re-stitched. Knives re-sharpened. Forever. The price of the piece includes a lifetime of care — because we believe objects should outlive trends."
        ctaLabel="How the covenant works"
        ctaHref="/aboutus"
        imageSrc={products[3]?.images?.[0]?.url}
        imageAlt={products[3]?.name || "A piece being restored"}
        reverse={true}
      />
    </>
  );
}

export default Home;
