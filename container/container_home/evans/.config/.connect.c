; Aetheric Relay Beacon XR-7 Configuration
; Last Calibration: Solstice of the Twin Moons, Year 347
; Operator: Arch-Sorcerer Valerius

[BeaconSettings]
BeaconID = XR7-Alpha-Primus
OperationalMode = LongRangeBroadcast ; Can be LongRangeBroadcast, TargetedRelay, EmergencyPulse
AethericFrequency = 77.3 ; in Kilo-Aetheric Units (kAu)
ManaConsumptionRate = 12.5 ; ManaUnits per hour
SignalEncryptionKey = EldoriaRoyalCipher_v3
AutoTuneToLeylines = True
MaxRange = 5000 ; in leagues

[PowerSource]
Primary = CrystallineManaMatrix
Secondary = SolarGlyphArray
EmergencyBackup = SacrificialAnimaCapacitor
LowPowerThreshold = 15% ; Percentage of total mana capacity

[Diagnostics]
LastSelfCheck = 2023-10-27T08:15:00Z
CrystalIntegrity = 98.7%
GlyphEfficiency = 92.1%
RuneStability = Nominal

[AllowedDestinations]
Node_Silverspire = 1A:3F:7C:0D
Node_WhisperingWoods = 2B:8E:4A:99
Node_DragonPeaksCitadel = 5G:1K:3R:0P
