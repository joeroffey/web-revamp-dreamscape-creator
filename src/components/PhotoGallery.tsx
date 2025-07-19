
export const PhotoGallery = () => {
  const images = [
    {
      src: "/lovable-uploads/162ed27b-7afc-4f87-aa37-6ca7dd50990e.png",
      alt: "Client enjoying ice bath therapy"
    },
    {
      src: "/lovable-uploads/81a80e52-fdb3-4434-af6a-736586d75f1c.png",
      alt: "Revitalise Hub entrance wall"
    },
    {
      src: "/lovable-uploads/13ce1fd0-0ae1-4b68-bc23-115c4cad4df5.png",
      alt: "Infrared sauna session"
    },
    {
      src: "/lovable-uploads/2286fefd-48ef-446c-a1e3-9ee8968bacbd.png",
      alt: "Ice bath facility with Revitalise Hub branding"
    },
    {
      src: "/lovable-uploads/0c4c3a2b-152f-4e1e-892e-82c619d37291.png",
      alt: "Ice bath recovery session"
    },
    {
      src: "/lovable-uploads/3a215db5-7a7e-4b25-be51-5ea78060e1b5.png",
      alt: "Wellness towels and amenities"
    },
    {
      src: "/lovable-uploads/1ade2762-70a2-4195-b776-a285f0680dd2.png",
      alt: "Shared ice bath experience"
    },
    {
      src: "/lovable-uploads/0dfff09d-022d-4b30-a6d6-dffc870d36c4.png",
      alt: "Recovery shower area"
    }
  ];

  return (
    <section className="py-16 bg-gallery">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div 
              key={index}
              className="aspect-square overflow-hidden rounded-2xl group cursor-pointer"
            >
              <img 
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
