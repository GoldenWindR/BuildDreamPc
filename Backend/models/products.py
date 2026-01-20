from marshmallow import Schema, fields, ValidationError


class CPUSchema(Schema):
    socket = fields.String(required=True)
    tdp = fields.Int(required=True)
    cores = fields.Int(required=True)
    threads = fields.Int(required=True)
    boost_clock = fields.Float(required=True)


class MotherboardSchema(Schema):
    socket = fields.String(required=True)
    chipset = fields.String(required=True)
    form_factor = fields.String(required=True)
    ram_type = fields.String(required=True)
    ram_slots = fields.Int(required=True)
    max_ram_speed = fields.Int(required=True)
    pcie_slots = fields.List(fields.Dict(), required=True)
    m2_slots = fields.Int(required=True)


class RAMSchema(Schema):
    ram_type = fields.String(required=True)
    speed = fields.Int(required=True)
    capacity = fields.Int(required=True)
    voltage = fields.Float(required=True)


class GPUSchema(Schema):
    length_mm = fields.Int(required=True)
    power_draw = fields.Int(required=True)
    power_connectors = fields.List(fields.String(), required=True)
    recommended_psu = fields.Int(required=True)


class PSUSchema(Schema):
    wattage = fields.Int(required=True)
    efficiency = fields.String(required=True)
    modular = fields.Bool(required=True)


class CaseSchema(Schema):
    supported_form_factors = fields.List(fields.String(), required=True)
    gpu_max_length_mm = fields.Int(required=True)
    psu_form_factor = fields.String(required=True)


class StorageSchema(Schema):
    type = fields.String(required=True)
    protocol = fields.String(required=True)
    capacity = fields.Int(required=True)
    speed_read = fields.Int(required=True)


DETAIL_SCHEMAS = {
    "cpu": CPUSchema(),
    "motherboard": MotherboardSchema(),
    "ram": RAMSchema(),
    "gpu": GPUSchema(),
    "psu": PSUSchema(),
    "case": CaseSchema(),
    "storage": StorageSchema(),
}
