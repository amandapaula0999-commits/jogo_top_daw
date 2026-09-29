#!/usr/bin/env python3
"""Compatibilidade: o importador vigente foi atualizado para a V4.14."""

from build_art_v44 import build_menu, import_idle


if __name__ == "__main__":
    build_menu()
    import_idle()
    print("Menu diegético v44 e idle importados.")
