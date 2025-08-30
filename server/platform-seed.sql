-- Insert platform entries if they don't exist
INSERT INTO pf_mst (pf_name) VALUES ('FlipkartGrocery') ON CONFLICT (pf_name) DO NOTHING;
INSERT INTO pf_mst (pf_name) VALUES ('Zepto') ON CONFLICT (pf_name) DO NOTHING;
INSERT INTO pf_mst (pf_name) VALUES ('CityMall') ON CONFLICT (pf_name) DO NOTHING;
INSERT INTO pf_mst (pf_name) VALUES ('Blinkit') ON CONFLICT (pf_name) DO NOTHING;
INSERT INTO pf_mst (pf_name) VALUES ('Swiggy') ON CONFLICT (pf_name) DO NOTHING;
INSERT INTO pf_mst (pf_name) VALUES ('BigBasket') ON CONFLICT (pf_name) DO NOTHING;
INSERT INTO pf_mst (pf_name) VALUES ('Zomato') ON CONFLICT (pf_name) DO NOTHING;
INSERT INTO pf_mst (pf_name) VALUES ('Dealshare') ON CONFLICT (pf_name) DO NOTHING;
INSERT INTO pf_mst (pf_name) VALUES ('Amazon') ON CONFLICT (pf_name) DO NOTHING;
INSERT INTO pf_mst (pf_name) VALUES ('JioMart') ON CONFLICT (pf_name) DO NOTHING;

-- Display the platforms to confirm
SELECT * FROM pf_mst;