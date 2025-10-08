export type SubscriptionTier = "basic" | "premium"

export type SubscriptionStatus = "active" | "cancelled" | "expired" | "paused"

export type ComponentType = "primer" | "powder" | "bullet" | "brass"

export type FirearmType = "rifle" | "pistol" | "shotgun" | "other"

export type MaintenanceType = "cleaning" | "repair" | "modification" | "inspection" | "other"

export interface Profile {
  id: string
  email: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  subscription_tier: SubscriptionTier
  lemon_squeezy_customer_id: string | null
  lemon_squeezy_subscription_id: string | null
  subscription_status: SubscriptionStatus | null
  subscription_ends_at: string | null
  created_at: string
  updated_at: string
}

export interface Component {
  id: string
  user_id: string
  type: ComponentType
  manufacturer: string
  model: string
  powder_category?: string | null
  powder_type?: string | null
  weight_unit?: string | null
  primer_type?: string | null
  caliber: string | null
  weight: number | null
  quantity: number
  price_paid: number | null
  cost_per_unit: number | null
  low_stock_threshold: number | null
  lot_number: string | null
  purchase_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Firearm {
  id: string
  user_id: string
  name: string
  manufacturer: string | null
  model: string | null
  serial_number: string | null
  caliber: string
  type: FirearmType | null
  barrel_length: number | null
  twist_rate: string | null
  round_count: number
  purchase_date: string | null
  image_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MaintenanceLog {
  id: string
  firearm_id: string
  user_id: string
  date: string
  type: MaintenanceType
  description: string
  cost: number | null
  created_at: string
}

export interface LoadRecipe {
  id: string
  user_id: string
  name: string
  caliber: string
  primer_id: string | null
  powder_id: string | null
  powder_weight: number
  bullet_id: string | null
  brass_id: string | null
  coal: number | null
  crimp_depth: number | null
  notes: string | null
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface ShootingSession {
  id: string
  user_id: string
  firearm_id: string
  load_recipe_id: string | null
  date: string
  location: string | null
  temperature: number | null
  humidity: number | null
  wind_speed: number | null
  wind_direction: string | null
  elevation: number | null
  rounds_fired: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ShotData {
  id: string
  session_id: string
  shot_number: number
  distance: number
  group_size: number | null
  velocity: number | null
  poi_horizontal: number | null
  poi_vertical: number | null
  notes: string | null
  created_at: string
}

export interface MaintenanceSchedule {
  id: string
  firearm_id: string
  user_id: string
  name: string
  type: MaintenanceType | "lubrication" | "parts_replacement"
  interval_type: "rounds" | "days" | "months"
  interval_value: number
  last_completed_at: string | null
  last_completed_round_count: number | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ReloadingSession {
  id: string
  user_id: string
  load_recipe_id: string
  date: string
  rounds_produced: number
  primer_component_id: string | null
  powder_component_id: string | null
  powder_weight_per_round: number
  bullet_component_id: string | null
  brass_component_id: string | null
  batch_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AmmunitionBatch {
  id: string
  user_id: string
  batch_number: string
  date_produced: string
  caliber: string
  quantity: number
  quantity_remaining: number
  ammunition_type: "handload" | "factory"

  // Factory ammo
  factory_manufacturer?: string | null
  factory_model?: string | null
  factory_lot_number?: string | null

  // Handload components
  primer_id?: string | null
  powder_id?: string | null
  bullet_id?: string | null
  brass_id?: string | null
  load_recipe_id?: string | null

  // Detailed measurements
  charge_weight_grains?: number | null
  coal?: number | null
  seating_depth_ogive?: number | null
  cartridge_weight_grains?: number | null
  neck_tension?: number | null
  bushing_size?: number | null
  case_trim_length?: number | null
  primer_seating_depth?: number | null
  crimp_type?: "roll" | "taper" | "none" | "factory" | null
  crimp_measurement?: number | null
  number_of_firings?: number

  // Cost
  cost_per_round?: number | null
  total_cost?: number | null

  notes?: string | null
  created_at: string
  updated_at: string
}

export interface UserTrackingPreferences {
  id: string
  user_id: string
  track_charge_weight: boolean
  track_coal: boolean
  track_seating_depth_ogive: boolean
  track_cartridge_weight: boolean
  track_neck_tension: boolean
  track_bushing_size: boolean
  track_case_trim_length: boolean
  track_primer_seating_depth: boolean
  track_crimp_type: boolean
  track_crimp_measurement: boolean
  track_number_of_firings: boolean
  created_at: string
  updated_at: string
}
