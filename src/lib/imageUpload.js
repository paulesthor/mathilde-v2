// Compression et upload d'images vers Supabase Storage.
// Utilisé par AdminProducts.jsx (bucket "products") et AdminContent.jsx
// (bucket "site-content") pour garantir un poids d'image raisonnable
// (temps de chargement du site + quotas de stockage Supabase).

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_ORIGINAL_SIZE_BYTES = 20 * 1024 * 1024; // 20 Mo — rejet pur au-delà
export const COMPRESSION_THRESHOLD_BYTES = 1.2 * 1024 * 1024; // 1.2 Mo — déclenche la compression

export function compressImage(file, maxWidth = 1600, maxHeight = 1600, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("Image compression failed"));
                            return;
                        }
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// Valide et compresse un fichier sélectionné par l'utilisateur.
// Retourne { file, wasCompressed }, ou lève une erreur avec un message affichable.
export async function prepareImageFile(file) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error("Format non supporté. Utilisez JPG, PNG ou WebP.");
    }
    if (file.size > MAX_ORIGINAL_SIZE_BYTES) {
        throw new Error("La photo d'origine dépasse la limite absolue de 20 Mo. Veuillez choisir une image plus petite.");
    }
    if (file.size > COMPRESSION_THRESHOLD_BYTES) {
        try {
            return { file: await compressImage(file), wasCompressed: true };
        } catch (err) {
            console.error("Image compression error:", err);
            return { file, wasCompressed: false };
        }
    }
    return { file, wasCompressed: false };
}

// Upload vers un bucket Supabase Storage public, nommage timestampé.
export async function uploadImageToBucket(supabase, bucket, file) {
    const fileExt = file.name.split('.').pop();
    const filePath = `${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
    if (uploadError) throw new Error("Erreur de téléversement photo : " + uploadError.message);

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return publicUrl;
}

// Supprime une image du bucket à partir de son URL publique, si elle appartient bien à ce bucket.
export async function removeImageFromBucket(supabase, bucket, publicUrl) {
    if (!publicUrl || !publicUrl.includes(`/storage/v1/object/public/${bucket}/`)) return;
    const fileName = publicUrl.split(`/${bucket}/`).pop();
    if (fileName) {
        await supabase.storage.from(bucket).remove([fileName]);
    }
}
