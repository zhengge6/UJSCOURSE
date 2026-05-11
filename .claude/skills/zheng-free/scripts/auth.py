# -*- coding: utf-8 -*-
"""
zheng-oath 验证模块
==================
接入 lepao.me 的 OAuth 2.0 + 卡密系统，为 skill 提供权限校验

配置文件位置: ~/.claude/skills/zheng-free/.auth.json
  { "token": "eyJ...", "username": "xxx", "tier": "premium", "saved_at": "2026-05-11" }

用法:
    from auth import require_auth, get_auth_info

    # 阻塞式：无权限则退出
    token = require_auth("judge")

    # 非阻塞：返回 None 表示无权限
    info = get_auth_info()
    if info and info["tier"] in ("premium", "enterprise"):
        ...
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Optional, Dict

try:
    import requests
except ImportError:
    requests = None

BASE_URL = "https://lepao.me"
CONFIG_PATH = Path(__file__).resolve().parent.parent / ".auth.json"

# 功能-等级映射
FEATURE_TIER = {
    "judge": "premium",       # 评审功能需要 premium+
    "codegen": "premium",     # 代码生成
    "paper": "premium",       # 论文撰写
    "modeling": "premium",    # 完整建模
    "analyze": "basic",       # 基础分析
}


def _load_config() -> Optional[Dict]:
    """从本地配置文件加载 token"""
    if not CONFIG_PATH.exists():
        return None
    try:
        return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return None


def _save_config(data: Dict):
    """保存 token 到本地配置文件"""
    data["saved_at"] = time.strftime("%Y-%m-%d %H:%M")
    CONFIG_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def validate_token(token: str) -> Dict:
    """调用 /api/auth/validate 校验 token"""
    if requests is None:
        return {"valid": False, "error": "requests 未安装，无法校验"}
    try:
        resp = requests.post(
            f"{BASE_URL}/api/auth/validate",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        return resp.json()
    except Exception as e:
        return {"valid": False, "error": str(e)}


def login(username: str, password: str) -> Dict:
    """Web 快捷登录"""
    if requests is None:
        return {"error": "requests 未安装"}
    try:
        resp = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": username, "password": password, "redirect_uri": "web"},
            timeout=15,
        )
        data = resp.json()
        if "access_token" in data:
            _save_config({
                "token": data["access_token"],
                "username": username,
                "tier": data.get("tier", "basic"),
            })
        return data
    except Exception as e:
        return {"error": str(e)}


def validate_card(code: str) -> Dict:
    """校验卡密（不消耗）"""
    if requests is None:
        return {"valid": False, "error": "requests 未安装"}
    try:
        resp = requests.post(
            f"{BASE_URL}/api/cards/validate",
            json={"code": code},
            timeout=10,
        )
        return resp.json()
    except Exception as e:
        return {"valid": False, "error": str(e)}


def redeem_card(code: str, token: str) -> Dict:
    """兑换卡密"""
    if requests is None:
        return {"error": "requests 未安装"}
    try:
        resp = requests.post(
            f"{BASE_URL}/api/cards/redeem",
            json={"code": code},
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        return resp.json()
    except Exception as e:
        return {"error": str(e)}


def get_auth_info() -> Optional[Dict]:
    """
    获取当前认证信息。
    优先使用本地缓存的 token，校验后返回用户信息。
    返回 None 表示未认证或已过期。
    """
    config = _load_config()
    if not config or not config.get("token"):
        return None

    result = validate_token(config["token"])
    if result.get("valid"):
        return {
            "token": config["token"],
            "username": result.get("username", config.get("username")),
            "tier": result.get("tier", "basic"),
            "features": result.get("features", []),
            "tier_expires_at": result.get("tier_expires_at"),
        }
    return None


def tier_level(tier: str) -> int:
    """tier 等级数值，用于比较"""
    levels = {"basic": 0, "premium": 1, "enterprise": 2}
    return levels.get(tier, 0)


def require_auth(feature: str = "judge") -> str:
    """
    阻塞式认证检查。
    返回有效的 access_token；无权限则打印提示并退出。
    """
    # 1. 尝试本地 token
    info = get_auth_info()
    if info:
        required_tier = FEATURE_TIER.get(feature, "premium")
        if tier_level(info["tier"]) >= tier_level(required_tier):
            return info["token"]
        else:
            print(f"\n  权限不足: {feature} 需要 {required_tier}+ 套餐")
            print(f"  当前套餐: {info['tier']}")
            print(f"  请前往 https://lepao.me/#pricing 升级，或使用卡密兑换")
            sys.exit(1)

    # 2. 无 token → 提示登录
    print("\n  ┌────────────────────────────────────────────┐")
    print("  │         zheng-oath 身份验证                 │")
    print("  └────────────────────────────────────────────┘")
    print(f"\n  {feature} 功能需要登录。")
    print("  选择验证方式:")
    print("    1. 用户名密码登录")
    print("    2. 卡密兑换")
    print("    3. 手动输入 token")

    choice = input("\n  请选择 [1/2/3]: ").strip()

    if choice == "1":
        username = input("  用户名: ").strip()
        password = input("  密码: ").strip()
        result = login(username, password)
        if "access_token" in result:
            print(f"  登录成功! 套餐: {result.get('tier', 'basic')}")
            return result["access_token"]
        else:
            print(f"  登录失败: {result.get('error', result.get('message', '未知错误'))}")
            sys.exit(1)

    elif choice == "2":
        code = input("  卡密: ").strip()
        # 先校验
        check = validate_card(code)
        if not check.get("valid"):
            print(f"  卡密无效: {check.get('message', '未知错误')}")
            sys.exit(1)
        print(f"  卡密有效: {check.get('card_type')} {check.get('duration')}, tier={check.get('tier')}")

        # 需要先有 token 才能兑换
        info = get_auth_info()
        if not info:
            print("  兑换卡密需要先登录。请先选择方式1登录。")
            sys.exit(1)
        result = redeem_card(code, info["token"])
        if result.get("success"):
            print(f"  兑换成功! 新套餐: {result.get('tier')}, 有效期至: {result.get('expires', '?')}")
            return info["token"]
        else:
            print(f"  兑换失败: {result.get('message', '未知错误')}")
            sys.exit(1)

    elif choice == "3":
        token = input("  Token: ").strip()
        result = validate_token(token)
        if result.get("valid"):
            _save_config({
                "token": token,
                "username": result.get("username", "?"),
                "tier": result.get("tier", "basic"),
            })
            print(f"  验证成功! 用户: {result.get('username')}, 套餐: {result.get('tier')}")
            return token
        else:
            print(f"  Token 无效: {result.get('error_description', '未知错误')}")
            sys.exit(1)

    else:
        print("  无效选择")
        sys.exit(1)


# CLI 入口
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法:")
        print("  python auth.py check          # 检查当前认证状态")
        print("  python auth.py login           # 交互式登录")
        print("  python auth.py card <code>     # 校验卡密")
        print("  python auth.py token <token>   # 校验 token")
        sys.exit(0)

    cmd = sys.argv[1]

    if cmd == "check":
        info = get_auth_info()
        if info:
            print(f"已登录: {info['username']} ({info['tier']})")
        else:
            print("未登录")

    elif cmd == "login":
        token = require_auth("analyze")
        print(f"Token: {token[:20]}...")

    elif cmd == "card":
        code = sys.argv[2] if len(sys.argv) > 2 else input("卡密: ")
        result = validate_card(code)
        print(json.dumps(result, ensure_ascii=False, indent=2))

    elif cmd == "token":
        t = sys.argv[2] if len(sys.argv) > 2 else input("Token: ")
        result = validate_token(t)
        print(json.dumps(result, ensure_ascii=False, indent=2))

    elif cmd == "tier":
        # 快捷输出当前 tier，供 SKILL.md 判断
        info = get_auth_info()
        if info:
            print(info["tier"])
        else:
            print("none")
