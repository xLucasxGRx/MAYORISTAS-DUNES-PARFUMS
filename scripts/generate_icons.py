import os
from PIL import Image

def generate_all_icons():
    src_path = os.path.join('logosDP', 'logodunesparfumsfondoblanco.jpg')
    if not os.path.exists(src_path):
        raise FileNotFoundError(f"No se encontró el logo fuente en {src_path}")

    # Cargar imagen fuente original (1280x1280)
    im = Image.open(src_path).convert('RGB')
    bg_color = (255, 255, 255) # Fondo blanco correspondiente al logo

    # Guardar copia PNG real del logo oficial con fondo blanco
    png_logo_path = os.path.join('logosDP', 'logo-dunes-parfums-blanco.png')
    im.save(png_logo_path, 'PNG', optimize=True)
    print(f"[OK] Generado copia PNG: {png_logo_path}")

    # Asegurar carpeta de destino requerida por index.html y manifest.json
    os.makedirs('assets', exist_ok=True)

    # 1. Iconos Estándar PWA & App
    sizes = {
        'icon-512.png': 512,
        'icon-192.png': 192,
        'apple-touch-icon.png': 180,
        'favicon-48x48.png': 48,
        'favicon-32x32.png': 32,
        'favicon-16x16.png': 16,
    }

    for filename, size in sizes.items():
        resized = im.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(os.path.join('assets', filename), 'PNG', optimize=True)
        print(f"[OK] Generado: {filename} ({size}x{size})")

    # 2. Iconos Maskable para Android (Zona segura 80% con fondo blanco)
    for s in [512, 192]:
        content_size = int(s * 0.80)
        offset = (s - content_size) // 2
        content_resized = im.resize((content_size, content_size), Image.Resampling.LANCZOS)
        maskable_canvas = Image.new('RGB', (s, s), bg_color)
        maskable_canvas.paste(content_resized, (offset, offset))
        
        maskable_name = f'icon-maskable-{s}.png'
        maskable_canvas.save(os.path.join('assets', maskable_name), 'PNG', optimize=True)
        print(f"[OK] Generado Maskable: {maskable_name} ({s}x{s} con zona segura 80%)")

    # 3. Favicon ICO Multi-resolución (16, 32, 48, 64)
    im.save('favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    im.save(os.path.join('assets', 'favicon.ico'), format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("[OK] Generado: favicon.ico (multi-resolución 16, 32, 48, 64)")

    print("\nTodos los favicons, iconos PWA y logo PNG de DUNES PARFUMS fueron generados con éxito.")

if __name__ == '__main__':
    generate_all_icons()

