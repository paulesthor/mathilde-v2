import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function MinimalModal({ isOpen, onClose, item }) {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen || !item) return null;

    const imageUrl = item.image || item.image_url;
    const paymentLink = item.paymentLink || item.stripe_payment_link;
    const formattedPrice = typeof item.price === 'number' ? `${item.price} €` : item.price;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4 sm:p-12 animate-in fade-in duration-300">

            <button
                onClick={onClose}
                className="absolute right-6 top-6 z-10 flex h-12 w-12 items-center justify-center text-foreground mix-blend-difference hover:text-primary transition-colors"
            >
                <X className="h-8 w-8" />
            </button>

            <div className="flex h-full w-full max-w-[1600px] flex-col md:flex-row items-center justify-center gap-12">
                <div className="w-full md:w-1/2 h-[50vh] md:h-[80vh]">
                    <img
                        src={imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                    />
                </div>
                <div className="w-full md:w-1/2 flex flex-col justify-center max-w-xl">
                    <h2 className="font-editorial text-5xl md:text-7xl leading-none">{item.title}</h2>
                    <div className="mt-8 space-y-4 text-lg text-muted-foreground font-sans font-light">
                        <p>{item.description}</p>
                    </div>
                    {item.details && item.details.length > 0 && (
                        <div className="mt-8 border-t border-foreground pt-8">
                            <ul className="space-y-2 font-mono text-sm tracking-wide text-foreground uppercase">
                                {item.details.map((detail, idx) => (
                                    <li key={idx}>— {detail}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {formattedPrice && (
                        <div className="mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-t border-foreground/10 pt-8">
                            <p className="font-editorial text-4xl">{formattedPrice}</p>
                            {paymentLink && (
                                <a
                                    href={paymentLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block bg-primary hover:bg-primary/95 text-white font-mono text-xs uppercase tracking-widest text-center px-8 py-4 transition-colors"
                                >
                                    Acheter en ligne
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
