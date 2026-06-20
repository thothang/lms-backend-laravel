FROM php:8.3-fpm

# Cài đặt extension hệ thống
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt các extension PHP cần thiết cho Laravel
RUN docker-php-ext-configure zip
RUN docker-php-ext-install pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip opcache

# Cấu hình PHP cho upload file lớn
RUN echo "upload_max_filesize = 100M" >> /usr/local/etc/php/conf.d/custom.ini
RUN echo "post_max_size = 100M" >> /usr/local/etc/php/conf.d/custom.ini
RUN echo "max_execution_time = 300" >> /usr/local/etc/php/conf.d/custom.ini
RUN echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/custom.ini

# Cấu hình OPcache tối ưu hóa tốc độ load (rất quan trọng cho Docker trên Windows)
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/custom.ini
RUN echo "opcache.memory_consumption=256" >> /usr/local/etc/php/conf.d/custom.ini
RUN echo "opcache.interned_strings_buffer=16" >> /usr/local/etc/php/conf.d/custom.ini
RUN echo "opcache.max_accelerated_files=20000" >> /usr/local/etc/php/conf.d/custom.ini
RUN echo "opcache.validate_timestamps=1" >> /usr/local/etc/php/conf.d/custom.ini
RUN echo "opcache.revalidate_freq=2" >> /usr/local/etc/php/conf.d/custom.ini
RUN echo "opcache.save_comments=1" >> /usr/local/etc/php/conf.d/custom.ini

# Cài đặt Composer
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

# Thiết lập thư mục làm việc
WORKDIR /var/www

# Chấp nhận thư mục source code (nếu có để map volume local)
# Đổi chủ thư mục web root cho user www-data
RUN chown -R www-data:www-data /var/www \
    && chmod -R 755 /var/www
