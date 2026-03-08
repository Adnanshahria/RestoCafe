-- RestoCafe Database Schema
-- Export for recreating in another PostgreSQL database

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'cashier');

-- ============================================
-- TABLES
-- ============================================

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Menu Items
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  description TEXT,
  image TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  visit_count INTEGER NOT NULL DEFAULT 0,
  last_visit TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending',
  table_number INTEGER,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order Items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  menu_item_id UUID REFERENCES public.menu_items(id),
  menu_item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  notes TEXT
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  customer_name TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Restaurant Tables (Floor Plan)
CREATE TABLE public.restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  number INTEGER NOT NULL,
  seats INTEGER NOT NULL DEFAULT 4,
  x NUMERIC(5,2) NOT NULL DEFAULT 50,
  y NUMERIC(5,2) NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'available',
  shape TEXT NOT NULL DEFAULT 'square',
  guest_name TEXT,
  guest_count INTEGER,
  occupied_since TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Role check (security definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Handle new user signup (create profile + assign default role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'cashier');
  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restaurant_tables_updated_at
  BEFORE UPDATE ON public.restaurant_tables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- NOTE: If using Supabase, add this trigger on auth.users:
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- User Roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Categories
CREATE POLICY "Categories readable by authenticated" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Menu Items
CREATE POLICY "Menu items readable by authenticated" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage menu items" ON public.menu_items FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Customers
CREATE POLICY "Customers readable by authenticated" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update customers" ON public.customers FOR UPDATE USING (true);

-- Orders
CREATE POLICY "Orders readable by authenticated" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Authenticated can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update orders" ON public.orders FOR UPDATE USING (true);

-- Order Items
CREATE POLICY "Order items readable by authenticated" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Authenticated can create order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Invoices
CREATE POLICY "Invoices readable by authenticated" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Authenticated can create invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update invoices" ON public.invoices FOR UPDATE USING (true);

-- Expenses
CREATE POLICY "Expenses readable by authenticated" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Authenticated can create expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update expenses" ON public.expenses FOR UPDATE USING (true);

-- Restaurant Tables
CREATE POLICY "Users can view all tables" ON public.restaurant_tables FOR SELECT USING (true);
CREATE POLICY "Users can insert tables" ON public.restaurant_tables FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update tables" ON public.restaurant_tables FOR UPDATE USING (true);
CREATE POLICY "Admins can delete tables" ON public.restaurant_tables FOR DELETE USING (has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
