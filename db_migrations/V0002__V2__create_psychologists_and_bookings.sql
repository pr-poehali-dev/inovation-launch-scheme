
CREATE TABLE t_p61927516_inovation_launch_sch.psychologists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar_initials TEXT NOT NULL,
  year_of_study INT NOT NULL,
  university TEXT NOT NULL,
  specialization TEXT[] NOT NULL,
  about TEXT NOT NULL,
  rating NUMERIC(2,1) DEFAULT 5.0,
  sessions_count INT DEFAULT 0,
  session_duration_min INT DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p61927516_inovation_launch_sch.psychologist_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID REFERENCES t_p61927516_inovation_launch_sch.psychologists(id),
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE t_p61927516_inovation_launch_sch.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID REFERENCES t_p61927516_inovation_launch_sch.psychologists(id),
  slot_id UUID REFERENCES t_p61927516_inovation_launch_sch.psychologist_slots(id),
  user_session_id TEXT NOT NULL,
  user_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  session_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON t_p61927516_inovation_launch_sch.psychologist_slots(psychologist_id);
CREATE INDEX ON t_p61927516_inovation_launch_sch.bookings(user_session_id);
CREATE INDEX ON t_p61927516_inovation_launch_sch.bookings(psychologist_id);

INSERT INTO t_p61927516_inovation_launch_sch.psychologists (name, avatar_initials, year_of_study, university, specialization, about, rating, sessions_count, session_duration_min) VALUES
('Анна Соколова', 'АС', 5, 'МГУ им. Ломоносова', ARRAY['тревожность', 'стресс', 'учёба'], 'Специализируюсь на работе со студенческим стрессом и тревогой. Помогаю найти баланс между учёбой и жизнью. Прошла 200+ часов личной терапии.', 4.9, 47, 30),
('Дмитрий Волков', 'ДВ', 4, 'РУДН', ARRAY['выгорание', 'мотивация', 'отношения'], 'Работаю с темами выгорания, потери мотивации и сложностей в отношениях. Сам прошёл через студенческое выгорание — знаю, как это бывает.', 4.8, 31, 30),
('Мария Петрова', 'МП', 5, 'ВШЭ', ARRAY['самооценка', 'прокрастинация', 'тревожность'], 'Помогаю студентам справляться с прокрастинацией, низкой самооценкой и перфекционизмом. Подход — КПТ и mindfulness.', 4.9, 58, 15),
('Илья Новиков', 'ИН', 4, 'СПбГУ', ARRAY['стресс', 'сон', 'тайм-менеджмент'], 'Специализируюсь на стрессе, нарушениях сна и тайм-менеджменте. Совмещаю учёбу и практику — понимаю студенческий ритм жизни.', 4.7, 22, 30);

INSERT INTO t_p61927516_inovation_launch_sch.psychologist_slots (psychologist_id, day_of_week, start_time, end_time) 
SELECT id, 1, '10:00', '10:30' FROM t_p61927516_inovation_launch_sch.psychologists WHERE name = 'Анна Соколова';
INSERT INTO t_p61927516_inovation_launch_sch.psychologist_slots (psychologist_id, day_of_week, start_time, end_time) 
SELECT id, 1, '11:00', '11:30' FROM t_p61927516_inovation_launch_sch.psychologists WHERE name = 'Анна Соколова';
INSERT INTO t_p61927516_inovation_launch_sch.psychologist_slots (psychologist_id, day_of_week, start_time, end_time) 
SELECT id, 3, '14:00', '14:30' FROM t_p61927516_inovation_launch_sch.psychologists WHERE name = 'Анна Соколова';
INSERT INTO t_p61927516_inovation_launch_sch.psychologist_slots (psychologist_id, day_of_week, start_time, end_time) 
SELECT id, 5, '16:00', '16:30' FROM t_p61927516_inovation_launch_sch.psychologists WHERE name = 'Анна Соколова';

INSERT INTO t_p61927516_inovation_launch_sch.psychologist_slots (psychologist_id, day_of_week, start_time, end_time) 
SELECT id, 2, '12:00', '12:30' FROM t_p61927516_inovation_launch_sch.psychologists WHERE name = 'Дмитрий Волков';
INSERT INTO t_p61927516_inovation_launch_sch.psychologist_slots (psychologist_id, day_of_week, start_time, end_time) 
SELECT id, 4, '18:00', '18:30' FROM t_p61927516_inovation_launch_sch.psychologists WHERE name = 'Дмитрий Волков';
INSERT INTO t_p61927516_inovation_launch_sch.psychologist_slots (psychologist_id, day_of_week, start_time, end_time) 
SELECT id, 6, '10:00', '10:30' FROM t_p61927516_inovation_launch_sch.psychologists WHERE name = 'Дмитрий Волков';

INSERT INTO t_p61927516_inovation_launch_sch.psychologist_slots (psychologist_id, day_of_week, start_time, end_time) 
SELECT id, 1, '15:00', '15:15' FROM t_p61927516_inovation_launch_sch.psychologists WHERE name = 'Мария Петрова';
INSERT INTO t_p61927516_inovation_launch_sch.psychologist_slots (psychologist_id, day_of_week, start_time, end_time) 
SELECT id, 2, '15:00', '15:15' FROM t_p61927516_inovation_launch_sch.psychologists WHERE name = 'Мария Петрова';
INSERT INTO t_p61927516_inovation_launch_sch.psychologist_slots (psychologist_id, day_of_week, start_time, end_time) 
SELECT id, 3, '15:00', '15:15' FROM t_p61927516_inovation_launch_sch.psychologists WHERE name = 'Мария Петрова';
INSERT INTO t_p61927516_inovation_launch_sch.psychologist_slots (psychologist_id, day_of_week, start_time, end_time) 
SELECT id, 5, '11:00', '11:15' FROM t_p61927516_inovation_launch_sch.psychologists WHERE name = 'Мария Петрова';

INSERT INTO t_p61927516_inovation_launch_sch.psychologist_slots (psychologist_id, day_of_week, start_time, end_time) 
SELECT id, 3, '19:00', '19:30' FROM t_p61927516_inovation_launch_sch.psychologists WHERE name = 'Илья Новиков';
INSERT INTO t_p61927516_inovation_launch_sch.psychologist_slots (psychologist_id, day_of_week, start_time, end_time) 
SELECT id, 5, '19:00', '19:30' FROM t_p61927516_inovation_launch_sch.psychologists WHERE name = 'Илья Новиков';
INSERT INTO t_p61927516_inovation_launch_sch.psychologist_slots (psychologist_id, day_of_week, start_time, end_time) 
SELECT id, 7, '12:00', '12:30' FROM t_p61927516_inovation_launch_sch.psychologists WHERE name = 'Илья Новиков';
