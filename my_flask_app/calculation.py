def calculate_abi(right_arm, left_arm, right_ankle, left_ankle):
    # Find highest brachial pressure
    highest_brachial = max(right_arm, left_arm)
    
    # Calculate ABI for each leg
    right_abi = round(right_ankle / highest_brachial, 2)
    left_abi = round(left_ankle / highest_brachial, 2)
    
    # Determine PAD risk level
    def get_risk_level(abi):
        if abi > 1.3:
            return "Non-compressible arteries"
        elif abi >= 0.9:
            return "Normal"
        elif abi >= 0.7:
            return "Mild PAD"
        elif abi >= 0.4:
            return "Moderate PAD"
        else:
            return "Severe PAD"
    
    return {
        'right_abi': right_abi,
        'left_abi': left_abi,
        'right_risk': get_risk_level(right_abi),
        'left_risk': get_risk_level(left_abi),
        'highest_brachial': highest_brachial
    }